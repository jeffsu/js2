require 'yaml'

module JS2
  # this is a hack for now until I can get v8 stable
  class Rack
    def get_root 
      @root ||= defined?(Rails) ? Rails.root : File.expand_path(Dir.getwd)
      return @root
    end

    def initialize(app)
      @app = app

      default = {
        'source_dir'  => "#{get_root}/app/js2",
        'target_dir'  => "#{get_root}/public/javascripts",
        'bin'         => (`which js2`.chomp rescue nil),
        'copy_js2'    => true
      }


      config = YAML.load_file(get_root + '/config/js2.yml') rescue default

      @source_dir = config['source_dir'] || './app/js2'
      @target_dir = config['target_dir'] || './public/javascripts'
      @bin        = config['bin'] || 'js2'
      @copy_js2   = config.has_key?('copy_js2') ? config['copy_js2'] : true

      @valid = @source_dir && @target_dir && !@bin.blank?

      unless @valid
        puts "JS2 is not configured properly"
      end
    end

    def call(env)
      if @copy_js2
        to_file = "#{get_root}/public/javascripts/js2.js"
        unless File.exists?(to_file) 
          from_file = JS2::ROOT + '/js2/browser.js'
          puts "--- #{get_root}"
          puts "#{from_file} #{to_file}"
          File.open(to_file, 'w') { |f| f << File.read(from_file) }
        end
      end

      `#{@bin} compile -f=browser -m #{@source_dir} #{@target_dir}` if @valid
      @app.call(env)
    end
  end
end
