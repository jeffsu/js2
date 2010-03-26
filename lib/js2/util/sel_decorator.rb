require 'json'

class JS2::Util::SelDecorator

  def initialize ()
    @references = Hash.new
    @in_class = false
  end

  def reset!
    @references = Hash.new
    @in_class = false
  end

  def decorate (str, node)
    if node.is_a?(JS2::Standard::ClassNode)
      return translate(str, nil, true)
    elsif node.is_a?(JS2::Standard::StuffNode)
      return translate(str, nil, false)
    else
      return str
    end
  end

  def translate (str, scope = nil, in_class = false)
    @scope    = scope
    @in_class = in_class
    ret = process_str(str)
    @in_class = false
    @scope    = nil
    return ret
  end

  def write_references  (dir)
    @references.each_pair do |klass, val|
      File.open(dir + '/' + klass + '.yml', 'w') do |out|
        YAML.dump(val, out)
      end
    end
  end

  private

  def process_str (str)
    lines     = str.split(/\r?\n/)
    processed = []

    lines.each do |line|
      # release comment and put it back in the queue
      line.sub!(%r|\s*//@=\s*.*|) do |str|
        if m = str.match(%r|(\s*)//@=\s*(.*)|) 
          m[1] + m[2]
        else
          str
        end
      end
    end

    while line = lines.shift

      # scope is defined
      if m = line.match(%r|^\s*//@\s*Scope\(([\w\.]+)\)|)
        @scope = "Page.#{m[1]}"
        processed.push(line)

      elsif @scope
        # if its a marker, reverse the next 2 lines
        if new_line = process_marker(line, lines.first)
          processed.push(lines.shift)
          processed.push(new_line)

        # var button = $('.button'); //@ Button
        elsif new_lines = process_tailing_marker(line)

          # reorder this and send it back through the loop
          # but with the marker on top
          lines.unshift(new_lines[1])
          lines.unshift(new_lines[0])
          next

        # proceed as normal
        else
          processed.push(line)
        end
      else
        processed.push(line)
      end
    end

    return processed.join("\n")
  end

  def process_marker (line, next_line)
    return false unless @scope && next_line

    #  //@  Foo // Bar
    #  //@+ Foo // Bar
    #                     pad  type        marker     comment
    if m = line.match(%r|^(\s*)//@(\+)?\s+([^/]+)\s*(//(.*))?$|)

      padding       = m[1]
      type          = m[2]
      marker        = m[3].strip

      whole_comment = m[4] 
      comment       = (m[5] || '').strip 

      # get lval 
      lval_match = next_line.match(/^\s*(var)?\s*([^\s=;]+)\s*/)

      return false unless lval_match
      lval = lval_match[2]

      # figure out what the lval should be
      # Button(<jquery selector>)
      key, find = parse_marker(marker)
      finder = find ? find.to_json : "null"

      # method to use for JS2.TEST.<addEle>(...)
      insert = type == "+" ? 'appendVal' : 'addVal'

      (@references[@scope] ||= {})[key] = comment
      scope = 
        if @in_class
          "TMP_SEL_MARKER.getRealClassScope(this)"
        else
          @scope.to_json
        end

      return padding + %{var TMP_SEL_MARKER = this.SEL_MARKER || JS2.SEL_MARKER; TMP_SEL_MARKER.#{insert}(#{scope}, #{key.to_json}, #{lval}, #{finder});}
    else
      return false
    end
  end

  # split a trailing marker into 2 lines
  def process_tailing_marker (line)
    if m = line.match(%r|^(\s*)([^\s]+.*)(//@.*)$|)
      new_line = m[1] + m[2]
      marker   = m[1] + m[3]
      return [ marker, new_line ]
    else
      return false
    end
  end

  def parse_marker (marker)
    #                     key        find
    if m = marker.match(/^([^\(]+)\(([^\)]*)\)?/)
      return [ m[1], m[2] ]
    else
      return [ marker, nil ]
    end
  end
end
