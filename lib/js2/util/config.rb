class JS2::Util::Config
  attr_accessor :node_factory, :lexer, :file_handler, :lexer, :haml_engine, :haml_vars, :asset_dir

  def initialize
    @lexer        = JS2::Parser::Lexer.new
    @node_factory = JS2::Standard::Factory.new
    @file_handler = JS2::Util::FileHandler.new
    @haml_engine  = JS2::Parser::HamlEngine.new
    @haml_vars    = {}
  end

  def self.from_yml(yml, env = nil)
    hash = YAML.load(yml)
    hash = hash[env] if env
    return self.from_hash(hash)
  end

  def load_hash (hash)
    self.file_handler.js2_dir = hash['js2_dir'] if hash['js2_dir']
    self.haml_engine = eval(hash['haml_engine_class'] + '.new') if hash['haml_engine_class']

    write_dir = hash['write_dir'] || hash['out_dir']
    self.file_handler.out_dir = write_dir if write_dir
    self.file_handler.haml_dir = hash['haml_dir'] || config.file_handler.js2_dir
  end

  def load_yml (yml, env = nil)
    hash = YAML.load_file('./config/js2.yml')  
    hash = hash[env] if env
    self.load_hash(hash)
  end

  def rails! (env = nil)
    self.out_dir = './public/javascript'
    self.js2_dir = './app/js2'

    begin
      if File.exist?('./config/js2.yml')
        self.load_yml('./config/js2.yml', env)
      end
    rescue
    end
  end
  

  def out_dir= (dir)
    @file_handler.out_dir = dir
  end

  def js2_dir= (dir)
    @file_handler.js2_dir = dir
  end

  def haml_dir= (dir)
    @file_handler.haml_dir = dir
  end

  def to_s
    return <<-END
js2_dir: #{@file_handler.js2_dir}
out_dir: #{@file_handler.out_dir}
haml_dir: #{@file_handler.haml_dir}
    END
  end

  def from_yml (yml, env = nil)
    hash = YAML.load(yml)
    hash = hash[env] if env
    return self.from_hash(hash)
  end

  def self.from_hash(hash)
    config = self.new
    config.load_hash(hash)

    return config
  end

  def example_yml
    return <<-END
js2_dir:  './app/js2'      
haml_dir: './app/js2'
out_dir:  './public/javascripts'
    END
  end
end
