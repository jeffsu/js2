require 'yaml'

module JS2
  # this is a hack for now until I can get v8 stable
  class Rack
    ROOT = File.expand_path(Dir.getwd)

    DEFAULT_CONFIG = {
      'in_dir'  => "#{ROOT}/app/js2",
      'out_dir' => "#{ROOT}/public/javascripts",
      'bin'     => (`which js2`.chomp rescue nil)
    }

    def initialize(app)
      @app = app

      @config = YAML.read_file(ROOT + '/config/js2.yml') rescue DEFAULT_CONFIG

      @in_dir  = @config['in_dir']
      @out_dir = @config['out_dir']
      @bin     = @config['bin']

      @valid = @in_dir && @out_dir && !@bin.blank?

      unless @valid
        puts "JS2 is not configured properly"
      end
    end

    def call(env)
      `#{@bin} compile #{@in_dir} #{@out_dir}` if @valid
      @app.call(env)
    end
  end
end
