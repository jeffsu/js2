class JS2::Util::Exec
  def initialize (config, options)
    @config = config 
  end

  def rails!
    @config.out_dir   = './public/javascripts'
    @config.js2_dir   = './app/js2'
    @config.asset_dir = './app/js2'
  end

  def normal!
    @config.out_dir = '.' 
    @config.js2_dir = '.' 
  end

  def daemonize (timeout = 1)
    get_processor!
    while 1
      @processor.process!
      sleep timeout
    end
  end

  def process
    get_processor!
    @processor.process!
  end

  def get_processor!
    @processor = JS2::Util::Processor.new(@config)
  end

end
