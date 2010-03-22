class JS2::Parser::Lexer
  def initialize (string, factory) 
    @string = string
    @root  = factory.new_node(:ROOT, 0, @string)
    @stack = []
  end

  def start_node (type, idx)
    child = @stack.last.add_child(type, idx, @string)
    @stack.push(child)
  end

  def stop_node (idx)
    last = @stack.pop()
    last.stop(idx)
  end
end

