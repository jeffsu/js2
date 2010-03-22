class JS2::Util::Compilation
  attr_accessor :klass_name, :dependencies, :template, :file
  @@already = Hash.new

  def initialize (klass_name, config, yml_file)
    @dependencies = config.dependencies || []
    @template     = config.template || []
    @klass_name   = klass_name
    @file         = file
  end

  def self.parse (yml_file)
    klasses = YAML.load_file(yml_file)
    klasses.each_pair do |k, config|
      self.new(k, config, yml_file)
    end
  end

  def self.reset!
    @@already = Hash.new
  end

  def compile (lookup)
    files = []
    @dependencies.each do |file|
    end

    @template.each do |config|
    end
  end
end
