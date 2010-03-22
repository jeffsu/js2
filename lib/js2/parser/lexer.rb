class JS2::Parser::Lexer
  def initialize
    @tokenizer = JS2::Parser::Tokenizer.new
  end

  def start_node (type, idx, is_static = false)
    puts type.to_s
    child = @stack.last.add_child(type, idx)
    @stack.push(child)
  end

  def stop_node (idx)
    puts "STOP! #{idx}"
    @last_idx = idx
    last = @stack.pop()
    last.stop(idx)
  end

  def parse (string, factory_klass)
    @string = string
    @root   = factory_klass.new.new_node(:ROOT, 0, @string)
    @stack  = [ @root ]
    @last_idx = 0

    @tokenizer.tokenize!(@string, self)
    @root.stop(@last_idx)
  end

  def parse_file (file, factory_klass)
    parse(File.read(file), factory_klass)
    return @root
  end
end

