require 'erb'

LITERALS = [ '!=', '!==', '#', '%', '%=', '&&', '&&=', '&=', '*', '*=', '+', '+=', ',', '-', '-=', '->', '.', '/', '/=', ':', '::', '<', '<<', '<<=', '<=', '=', '==', '===', '>', '>=', '>>', '>>=', '>>>', '>>>=', '?', '@', '[', '^', '^=', '^^', '^^=', '|', '|=', '||', '||=', 'abstract', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'field', 'final', 'finally', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'static', 'switch', 'synchronized', 'throw', 'throws', 'transient', 'try', 'typeof', 'var', 'volatile', 'while', 'with', 'foreach', 'module', 'include' ]

class Helper
  def initialize
    @types = []
  end

  def def_literals
    ret = []
    LITERALS.each do |literal|
      ret << "'#{literal}' ws* regexpliteral => { };"
    end
    ret.join("\n") + "\n"
  end

  def warn_int (int)
    return <<-END
      rb_funcall2(self, warn_sym, 1, warn_intv);
    END
  end

  def mark_node ()
    return <<-END
      mark_node(ts-data+1)
    END
  end

  def start_node (type, idx = nil, ignore_curly = false) 
    return <<-END
      #{ignore_curly ? '' : 'curly_idx += 1; curlies[curly_idx] = cb_count'};
      start_node(:#{type}, #{idx || 'ts-data.length'}, is_static)
      is_static = false
    END
  end

  def comment () 
    return <<-END
      start_node(:COMMENT, ts-data.length, is_static)
      is_static = false
      stop_node(te-data.length)
    END

  end


  def start_member (type, idx = nil) 
    return <<-END
      close_on_semi = true
      start_node(:#{type}, #{idx || 'ts-data.length'}, is_static)
      is_static = false
    END
  end


  def stop_node  (idx = nil)
    return <<-END
      curly -= 1 if curly_idx > 0
      stop_node(#{idx || 'te-data.length'})
    END
  end

  def stop_member (idx = nil)
    return <<-END
      close_on_semi = false
      stop_node(#{idx || 'te-data.length'})
    END
  end


  def in_class 
    return "in_class == (cb_count + 1)"
  end

  def in_module
    return "in_class == curly_idx"
  end


end

replacer = Helper.new
template = ERB.new(File.read('./tokenizer.rl.erb'), 0, "%<>")

File.open('./tokenizer.rl', 'w') do |f|
  f << template.result(binding)
end
