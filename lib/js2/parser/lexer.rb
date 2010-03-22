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

  def parse (string, factory, file = nil)
    @string = string
    @root   = factory.root_node(string, file)
    @stack  = [ @root ]
    @last_idx = 0

    @tokenizer.tokenize!(@string, self)
    @root.stop(@last_idx)
  end

  def parse_file (file, factory)
    parse(File.read(file), factory, file)
    return @root
  end
end

