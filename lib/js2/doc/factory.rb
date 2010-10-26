
# TODO: break this up into multiple files
class JS2::Doc::PageNode < JS2::Standard::Node
  attr_accessor :klasses, :file

  def initialize (idx, string, factory)
    @klasses = []
    super(idx, string, factory)
  end

end

class JS2::Doc::CommentNode < JS2::Standard::Node
  def clean
    return to_s.gsub(%r|^\s*\/?\*+\s?\/?|, '')
  end
end

class JS2::Doc::ClassNode < JS2::Standard::Node
  REGEX = /^(\s*class|module)\s+([\w\.]+)\s+(extends\s+([\w\.]+))?\s*\{(.*)/m

end

class JS2::Doc::ModuleNode < JS2::Doc::ClassNode
end

class JS2::Doc::PrivateNode < JS2::Standard::Node
end

class JS2::Doc::IncludeNode < JS2::Standard::Node
end


class JS2::Doc::MemberNode < JS2::Standard::Node
end

class JS2::Doc::CurryNode < JS2::Standard::Node
end


class JS2::Doc::MethodNode < JS2::Standard::Node
  REGEX = /^(\s*)(static\s+)?function\s+([\$\w\.]+)\s*\(([^)]*)\)\s*\{(.*)/m

  def handle_first_string (s)
    m = s.match(REGEX)
    space  = m[1]
    @static = m[2]
    @name   = m[3]
    @args   = m[4]
    @start  = m[5]
    return s
  end

end

class JS2::Doc::AccessorNode < JS2::Standard::Node
  REGEX = /(\s*)accessor(\s+)([\w+,\s]+\w)(\s*);(\s*)/

  def handle_first_string (str)
    m = str.match(REGEX)
    space     = m[1]
    mid_space = m[2]
    list      = m[3].split(/,/).collect { |i| i.strip }
    end_space = m[4]
    trailing  = m[5]

    return str
  end
end

class JS2::Doc::ForeachNode < JS2::Standard::Node
end

class JS2::Doc::PropertyNode < JS2::Standard::Node
  REGEX = /(\s*)property(\s+)([\w+,\s]+\w)(\s*);(\s*)/
  def handle_first_string (s)
    return s
  end
end


class JS2::Doc::StuffNode < JS2::Standard::Node
end


class JS2::Doc::Factory
  attr_accessor :decorators

  @@supports = [ :CLASS, :MEMBER, :METHOD, :ACCESSOR, :FOREACH, :PROPERTY, :INCLUDE, :CURRY, :PAGE, :COMMENT, :STUFF, :MODULE, :PRIVATE ]
  @@lookup = Hash.new

  @@supports.each do |v|
    name = v.to_s.downcase.sub(/(\w)/) { |m| m.upcase }
    @@lookup[v] = eval "JS2::Doc::#{name}Node"
  end

  def initialize 
    @decorators = []
  end

  def get_class (type)
    klass = @@lookup[type] || JS2::Standard::Node
  end

  def page_node (string, file = nil)
    @page = new_node(:PAGE, 0, string) 
    @page.file = file
    @comment = nil
    return @page
  end

  def new_node (type, idx, string)
    klass = get_class(type)
    node = klass.new(idx, string, self)

    if type == :CLASS || type == :MODULE
      @page.klasses << node
    end

    if type == :COMMENT
      @comment = node
    elsif @comment
      node.comment = @comment
      @comment = nil
    end

    setup_node(node)

    return node
  end

  def setup_node (node)
    # virtual
  end
end

