begin
  require 'rubygems'
  require 'haml'
  require 'erb'
  require 'json'

class JS2::Parser::Haml
  attr_accessor :vars

  def initialize (haml_engine = nil, vars = nil)
    @haml_engine = haml_engine || JS2::Parser::HamlEngine.new
    @vars = vars || Hash.new
  end

  def parse_out_js (file)
    padding = nil
    js = []

    File.read(file).split(/\r?\n/).each do |line|
      if m = line.match(/^(\s*):js2/)
        padding = m[1]
      elsif padding 
        if m = line.match(/^#{padding}/)
          js << line
        elsif ! line.match(/^\s*$/)
          padding = nil
        end
      end
    end

    return js.join("\n")
  end

  def parse (file)
    erb = ERB.new(File.read(file))
    str = erb.result(binding)

    lines  = str.split(/\r?\n/)
    result = Hash.new

    klass = Hash.new
    key   = nil

    until lines.empty?
      line = lines.shift()

      if m = line.match(/^\.?([\w\.]+)/)
        klass = Hash.new
        result[m[1]] = klass

      elsif m = line.match(/^  sass(.*)/)
        key = 'sass'
        klass[key] = [ [ ], '', true ]

      elsif m = line.match(/^  \.?([\w]+)(\(([^)]+)\))?/)
        key = m[1]
        klass[key] = [ [], m[3] ] 
      elsif key
        if key == 'sass' && ! klass[key][2]
          klass[key][0] << line.sub(/^  /, '')
        else
          klass[key][0] << line.sub(/^    /, '')
        end
      end
    end

    result.keys.each do |class_name|
      klass = result[class_name]
      klass.each_pair do |key, array|
        if key == 'sass'
          unless array[2]
            array[0].unshift ".#{class_name.sub(/\.\w+$/, '').sub(/\./, '')}"
          end

          klass[key] = sassify(array[0].join("\n"))
        else
          klass[key] = functionize(array[0].join("\n"), array[1])
        end
      end
    end

    return result
  rescue Exception => e
    puts file
    raise e
  end

  private

  def sassify (string)
    begin
      css = @haml_engine.sassify(string)
    rescue Exception => e
      puts "Error Processing SASS:"
      puts string
      puts e.backtrace.join("\n")
      raise e
    end
    return css.gsub(/\n/, '').to_json
  end

  def functionize (string, params)
    begin
      html = @haml_engine.hamlize(string)
    rescue Exception => e
      puts "Error Processing HAML:"
      puts string
      puts e.backtrace.join("\n")
      raise e
    end

    if params
      return functionize_with_params(html, params)
    end

    counter = 0
    segments = html.split(%r|#\w+#|).collect { |seg| seg.to_json }
    ret = Array.new
    segments.each_with_index do |seg, i|
      ret.push(seg)
      ret.push(%{arguments[#{i}]}) if (segments.length-1) > i
    end
    return %{function(){return #{ret.join('+')}}}
  end


  def functionize_with_params (string, params) 
    args = []
    string.gsub!(/#([^#]+)#/) do |m|
      args << m.gsub(/#/, '')
      '###'
    end

    segments = string.split(%r|###|).collect { |seg| seg.to_json }
    ret = segments.zip(args).flatten.reject { |a| a.nil? }.join('+');
    return %{function(#{params}){return #{ret}}}
  end


end
rescue Exception
  puts "HAML is not supported"


end
