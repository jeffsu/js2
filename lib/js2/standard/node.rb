class JS2::Standard::Node
  attr_accessor :type, :start_idx, :stop_idx, :children, :starting, :factory

  def initialize (start_idx, str, factory)
    @start_idx = start_idx
    @string    = str
    @children  = []
    @factory   = factory
  end

  def add_child (type, start_idx)
    child = factory.new_node(type, start_idx, @string)
    @children.push(child)
    return child
  end

  def stop (idx)
    @stop_idx = idx
    process_elements!
  end

  def to_s ()
    last_idx = @start_idx
    str = ''
    
    first = true
    @children.each do |c|
      if c.start_idx > last_idx
        str << handle_string(@string[last_idx .. c.start_idx], first)
        first = false
      end

      str << c.to_s
      last_idx = c.stop_idx
    end

    if last_idx < @stop_idx
      str << handle_string(@string[last_idx .. @stop_idx], first)
    end

    return elements
  end

  private

  def handle_string (str, first) 
    if first
      return handle_first_string(str)
    else
      return str 
    end
  end

  def handle_first_string (str)
    return str
  end

end
