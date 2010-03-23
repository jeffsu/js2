class JS2::Parser::Lexer
  def initialize
    @tokenizer = JS2::Parser::Tokenizer.new
  end

  def start_node (type, idx, is_static = false)
    child = @stack.last.add_child(type, idx)
    @stack.push(child)
  end

  def stop_node (idx)
    @last_idx = idx
    last = @stack.pop()
    last.stop(idx)
  end

  def parse (string, factory, file = nil)
    @string = string
    @page   = factory.page_node(string, file)
    @stack  = [ @page ]
    @last_idx = 0

    @tokenizer.tokenize!(@string, self)
    @page.stop(@last_idx)
  end

  def parse_file (file, factory)
    parse(File.read(file), factory, file)
    return @page
  end
end

