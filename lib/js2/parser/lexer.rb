class JS2::Parser::Lexer
  def initialize
    @tokenizer = JS2::Parser::Tokenizer.new
  end

  def start_node (type, idx, is_static = false)
    child = @stack.last.add_child(type, idx, @string)
    @stack.push(child)
  end

  def stop_node (idx)
    last = @stack.pop()
    last.stop(idx)
  end

  def parse_file (file, factory)
    @string = File.read(file)
    @root   = factory.new_node(:ROOT, 0, @string)
    @stack  = []

    @tokenizer.tokenize!(@string, self)
  end
end

