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

  def rails!
    self.out_dir = './public/javascript'
    self.js2_dir = './app/js2'
  end

  def out_dir= (dir)
    @file_handler.out_dir = dir
  end

  def js2_dir= (dir)
    @file_handler.js2_dir = dir
  end

  def from_yml (yml, env = nil)
    hash = YAML.load(yml)
    hash = hash[env] if env
    return self.from_hash(hash)
  end

  def self.from_hash(hash)
    config = self.new

    config.file_handler.js2_dir = hash['js2_dir'] if hash['js2_dir']
    config.haml_engine = eval(hash['haml_engine_class'] + '.new') if hash['haml_engine_class']

    write_dir = hash['write_dir'] || hash['out_dir']
    config.file_handler.out_dir = write_dir if write_dir

    config.file_handler.haml_dir = hash['haml_dir'] || config.file_handler.js2_dir

    return config
  end
end
