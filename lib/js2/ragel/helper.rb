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
      mark_argv[0] = INT2FIX(ts-data+1);
      rb_funcall2(self, mark_sym, 1, mark_argv);
    END
  end

  def start_node (type, idx = nil, ignore_curly = false) 
    return <<-END
      #{ignore_curly ? '' : 'curlies[++curly_idx] = cb_count;'};

      start_argv[0] = sym_#{type};
      start_argv[1] = INT2FIX(#{idx || 'ts-data'});
      start_argv[2] = INT2FIX(is_static);
      rb_funcall2(self, start_sym, 3, start_argv);
      is_static = 0;
    END
  end

  def start_member (type, idx = nil) 
    return <<-END
      close_on_semi = 1;
      start_argv[0] = sym_#{type};
      start_argv[1] = INT2FIX(#{idx || 'ts-data'});
      start_argv[2] = INT2FIX(is_static);
      rb_funcall2(self, start_sym, 3, start_argv);
      is_static = 0;
    END
  end


  def stop_node  (idx = nil)
    return <<-END
      if (curly_idx) curly_idx--;
      stop_argv[0] = INT2FIX(#{idx || 'te-data'});
      rb_funcall2(self, stop_sym, 1, stop_argv);
    END
  end

  def stop_member (idx = nil)
    return <<-END
      close_on_semi = 0;
      stop_argv[0] = INT2FIX(#{idx || 'te-data'});
      rb_funcall2(self, stop_sym, 1, stop_argv);
    END
  end


  def in_class 
    return "in_class == (cb_count + 1)"
  end

  def in_module
    return "in_class == curly_idx || in_module == curly_idx"
  end

  def declare_vars (types)
    ret = ''
    types.each do |type|
      ret += self.declare(type)
    end

    return ret
  end

  def declare (type)
    return <<-END
      // #{type}
      ID  sym_#{type} = ID2SYM(rb_intern("#{type}"));
    END
  end

end

replacer = Helper.new
template = ERB.new(File.read('./tokenizer.rl.erb'), 0, "%<>")

File.open('./tokenizer.rl', 'w') do |f|
  f << template.result(binding)
end
