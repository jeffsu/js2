require 'yaml'
require 'ftools'

module JS2
  # this is a hack for now until I can get v8 stable
  class Rack
    ROOT = File.expand_path(Dir.getwd)

    DEFAULT_CONFIG = {
      'source_dir'  => "#{ROOT}/app/js2",
      'out_dir'     => "#{ROOT}/public/javascripts",
      'bin'         => (`which js2`.chomp rescue nil),
      'copy_js2'    => true
    }

    def initialize(app)
      @app = app

      config = YAML.read_file(ROOT + '/config/js2.yml') rescue DEFAULT_CONFIG

      @source_dir = config['source_dir']
      @out_dir    = config['out_dir']
      @bin        = config['bin']
      @copy_js2   = config['copy_js2']

      @valid = @source_dir && @out_dir && !@bin.blank?

      unless @valid
        puts "JS2 is not configured properly"
      end
    end

    def call(env)
      if @copy_js2
        to_file = ROOT + '/public/javascripts/js2.js'
        unless File.exists?(to_file) 
          from_file = JS2::ROOT + '/js2/browser.js'
          File.copy(from_file, to_file)
        end
      end

      `#{@bin} compile -f=browser #{@source_dir} #{@out_dir}` if @valid
      @app.call(env)
    end
  end
end
