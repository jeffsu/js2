class JS2::Standard::Node
  attr_accessor :type, :start_idx, :stop_idx, :children, :starting, :factory, :comment

  def initialize (start_idx, str, factory)
    @start_idx = start_idx
    @string    = str
    @children  = []
    @factory   = factory
    @output    = ''
  end

  def add_child (type, start_idx)
    child = factory.new_node(type, start_idx, @string)
    @children.push(child)
    return child
  end

  def stop (idx)
    @stop_idx = idx
    process!
  end

  def to_s
    return @output
  end

  def process! ()
    last_idx = @start_idx
    str = ''

    first = true
    @children.each do |c|
      if c.start_idx > last_idx
        str << handle_string(@string[last_idx .. c.start_idx-1], first)
        first = false
      end

      result = c.to_s()

      @factory.decorators.each do |d|
        d.decorate(result, c) 
      end

      str << result
      last_idx = c.stop_idx + 1
    end

    if last_idx < @stop_idx
      str << handle_string(@string[last_idx .. @stop_idx], first)
    end

    str = handle_ending(str)

    @output = str 
  end

  private

  def handle_string (str, first) 
    if first
      return handle_first_string(str)
    else
      return str 
    end
  end

  def handle_ending (str)
    return str
  end

  def handle_first_string (str)
    return str
  end

end
