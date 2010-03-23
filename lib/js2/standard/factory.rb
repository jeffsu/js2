class JS2::Standard::PageNode < JS2::Standard::Node
  attr_accessor :klasses, :file

  def initialize (idx, string, factory)
    @klasses = []
    super(idx, string, factory)
  end

  def stop (idx)
    JS2::Standard::ForeachNode.reset!
    super(idx)
  end
end

class JS2::Standard::ClassNode < JS2::Standard::Node
  REGEX = /^(\s*class|module)\s+([\w\.]+)\s+(extends\s+([\w\.]+))?\s*\{(.*)/m

  def handle_first_string (str)
    if m = str.match(REGEX)
      @name    = m[2]
      @extends = m[4]
      @ending  = m[5]

      if @extends
        @extends = "#{@name}.oo('extends', #{@extends});"
      end

      return %|JS2.OO.#{create_name}("#{@name}"); #{@extends} (function (K,Package) {var self=K; var _super=JS2.OO['super']; #{@ending}|
    end
  end

  def name
    if m = @string.match(REGEX)
      return m[2]
    else
      return ''
    end
  end

  def create_name
    return 'createClass'
  end

  def handle_ending (str)
    pkg = @name.split(/\./)
    pkg.pop()

    if pkg.empty?
      pkg = 'null'
    else
      pkg = pkg.join('.')
    end

    return str.sub(/\s*\z/, ")(#{@name}, #{pkg});")
  end
end

class JS2::Standard::ModuleNode < JS2::Standard::ClassNode
  def createName
    return 'createModule'
  end
end

class JS2::Standard::PrivateNode < JS2::Standard::Node
  def handle_first_string
    return first.sub(/private/m, '// private')
  end
end

class JS2::Standard::IncludeNode < JS2::Standard::Node
  def handle_first_string (s)
    return s.sub(/include\s*/, "K.oo('include', ").sub(/;$/, ');');
  end
end


class JS2::Standard::MemberNode < JS2::Standard::Node
  def handle_first_string (s)
    method = 'member'

    if s.match(/^(\s*)(static)\s*/)
      method = 'staticMember'
      s = s.sub(/static\s*/, '')
    end

    return s.sub(/var\s*([\$\w]+)/) { "K.oo('#{method}', '" + $1 + "'" }.sub(/;$/, ');').sub(/\s*=/, ', ');
  end

end

class JS2::Standard::CurryNode < JS2::Standard::Node
  REGEX       = %r|^curry\s*([^\{]*)?\{(.*)$|m
  REGEX_WITH  = %r|with\s+\(([^)]*)\)|
  REGEX_ARGS  = %r|^\s*\(([^)]*)\)|

  def handle_first_string
    m = first.match(REGEX)
    @decl = m[1].strip
    @stop = m[2]

    @args      = ''
    @in_scoped = ''
    @scoped    = ''

    if m = @decl.match(REGEX_WITH)
      in_scoped = m[1].split(',').collect { |v| v.strip }
      scoped    = in_scoped.collect { |v| v == 'this' ? 'self' : v }
      if in_scoped.length
        @scoped =  scoped.join(', ')
        @in_scoped = in_scoped.join(', ')
      end
    end

    if m = @decl.match(%r|^\s*\(([^)]*)\)|)
      @args = m[1].strip
    end

    return %|(function (#{@scoped}) { return function (#{@args}) {#{@stop}|
  end

  def handle_ending (str)
    return %|#{str}})(#{@in_scoped})|
  end
end


class JS2::Standard::MethodNode < JS2::Standard::Node
  REGEX = /^(\s*)(static\s+)?function\s+([\$\w\.]+)\s*\(([^)]*)\)\s*\{(.*)/m

  def handle_first_string (s)
    m = s.match(REGEX)
    space  = m[1]
    static = m[2]
    name   = m[3]
    args   = m[4]
    start  = m[5]

    m = static ? 'staticMember' : 'method'
    return %|#{space}K.oo('#{m}', "#{name}", function (#{args}) {#{start}|
  end

  def handle_ending (str)
    return str.sub!(/(\s*)\z/) { |m| ");#{m}" }
  end

end

class JS2::Standard::AccessorNode < JS2::Standard::Node
  REGEX = /(\s*)accessor(\s+)([\w+,\s]+\w)(\s*);(\s*)/

  def handle_first_string (str)
    puts "{#{str}}"
    m = str.match(REGEX)
    space     = m[1]
    mid_space = m[2]
    list      = m[3].split(/,/).collect { |i| i.strip }
    end_space = m[4]
    trailing  = m[5]

    return %|#{space}K.oo('accessor',#{mid_space}[ #{list.collect { |i| "'#{i}'" }.join(',')} ])#{end_space};#{trailing}|
  end
end

class JS2::Standard::ForeachNode < JS2::Standard::Node
  #                   start     var           iterator           array
  REGEX = /(\s*)foreach\s*\(\s*var\s*([\$\w]+)(\s*:\s*([\$\w]))?\s*in\s*([^\s]+)\s*\)/
  attr_accessor :iterator, :item, :array
  @@inc = 0

  def handle_first_string (s)
    m = s.match(REGEX)
    start    = m[1]
    item     = m[2]
    iterator = m[4]
    array    = m[5]

    it = iterator

    unless iterator
      it = 'it' + @@inc.to_s
      @@inc += 1
    end

    len = it + '__len'
    arr = it + '__arr'

    return %(#{start}for (var #{it}=0,#{item},#{arr}=#{array},#{len}=#{arr}.length; (#{item}=#{arr}[#{it}]) || #{it}<#{len}; #{it}++))
  end

  def self.reset!
    @@inc = 0
  end
end

class JS2::Standard::PropertyNode < JS2::Standard::Node
  REGEX = /(\s*)property(\s+)([\w+,\s]+\w)(\s*);(\s*)/
  def setup!
    m = first.match(REGEX)
    space     = m[1]
    mid_space = m[2]
    list      = m[3].split(/,/).collect { |i| i.strip }
    end_space = m[4]
    trailing  = m[5]

    return %|#{space}K.oo('property',#{mid_space}[ #{list.collect { |i| "'#{i}'" }.join(',')} ])#{end_space};#{trailing}|
  end
end


class JS2::Standard::StuffNode < JS2::Standard::Node
end


class JS2::Standard::Factory
  @@supports = [ :CLASS, :MEMBER, :METHOD, :ACCESSOR, :FOREACH, :PROPERTY, :INCLUDE, :CURRY, :PAGE ]
  @@lookup = Hash.new

  @@supports.each do |v|
    name = v.to_s.downcase.sub(/(\w)/) { |m| m.upcase }
    @@lookup[v] = eval "JS2::Standard::#{name}Node"
  end

  def page_node (string, file = nil)
    @page = new_node(:PAGE, 0, string) 
    @page.file = file
    return @page
  end

  def new_node (type, idx, string)
    klass = @@lookup[type] || JS2::Standard::Node
    node = klass.new(idx, string, self)
    if type == :CLASS || type == :MODULE
      @page.klasses << node
    end

    return node
  end

end

