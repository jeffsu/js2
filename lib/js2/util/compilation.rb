class JS2::Util::Compilation
  attr_accessor :klass_name, :require, :include, :template, :file
  @@already = Hash.new

  def initialize (klass_name, config, yml_file, file_handler)
    @require      = config['require'] || []
    @include      = config['include'] || []
    @template     = config['template'] || []
    @klass_name   = klass_name
    @file         = file
    @file_handler = file_handler

    @make_compilation = config['make_compilation']
  end

  def self.parse (yml_file, file_handler)
    klasses = YAML.load_file(yml_file)

    comps = []
    klasses.each_pair do |k, config|
      comps << self.new(k, config, yml_file, file_handler)
    end

    return comps
  end

  def self.reset!
    @@already = Hash.new
  end

  def compile (klasses)
    return unless @make_compilation

    main_file = nil
    if files = klasses[@klass_name]
      main_file = @file_handler.outfile(files.first)
    else
      return
    end

    before = []
    @require.each do |file|
      before += get_files(file, klasses)
    end

    after = []
    @include.each do |file|
      after += get_files(file, klasses)
    end

    @template.each do |item|
      after += get_files(item['class'], klasses)
    end

    file = main_file.sub(/\.js$/, '.comp.js')
    all_files = before + [ main_file ] + after
    str = all_files.collect { |f| File.read(f) }.join("\n")
    File.open(file, 'w') { |f| f << str }
  end

  def get_files (klass_name_or_file, klasses)
    ret = nil 
    if files = klasses[klass_name_or_file]
      ret = files.collect { |f| @file_handler.outfile(f) }
    else
      ret = @file_handler.outfile(klass_name_or_file)
    end
  end
end
