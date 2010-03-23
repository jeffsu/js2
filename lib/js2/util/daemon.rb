class JS2::Util::Daemon
  def initialize (config, time)
    p = JS2::Util::Processor.new(config) 
    @time = time
  end

  def run
    while (1)
      p.process!
      sleep @time
    end
  end
end
