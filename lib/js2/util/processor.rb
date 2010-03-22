class JS2::Util::Processor
  def initialize (config)
    @file_handler = config.file_handler
    @lexer        = config.lexer
    @factory      = config.node_factory
    @haml_parser  = config.haml_parser

    @lookup = JS2::Util::UniverseLookup.new
    @first_time = true
    @config = config
  end

  def process!
    if @first_time
      process_all!
    end
  end

  # 1) js2 files
  # 2) html assets
  # 3) compilation
  def process_all!
    @file_handler.get_js2_files.each do |file|
      root = @lexer.parse_file(file, @factory)
      @lookup.store_root(root)
      @file_handler.write_file(file, root.to_s)
    end

    @file_handler.get_haml_files.each do |file|
      assets = @haml_parser.parse_file(file)

      assets.each_pair do |key, str|
        @lookup.store_asset(asset)
        files = @lookup.klasses[klass]
        if files
          @file_handler.append_file(files[0], str)
        end
      end
    end
  end

  def compilation_sanity_check

  end
end
