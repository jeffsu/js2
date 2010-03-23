class JS2::Util::Processor
  def initialize (config)
    @file_handler = config.file_handler
    @lexer        = config.lexer
    @factory      = config.node_factory
    @haml_engine  = config.haml_engine
    @haml_parser  = JS2::Parser::Haml.new(config.haml_engine, config.haml_vars)

    @lookup = Hash.new

    @config = config
  end

  def process!
    return unless @file_handler.needs_update?

    pages = []
    klasses = Hash.new

    @file_handler.get_files(:js2).each do |file|
      page = @lexer.parse_file(file, @factory)
      page.klasses.each do |k|
        (klasses[k.name] ||= []) << page.file
      end

      pages << page

      outfile = @file_handler.outfile(page.file)
      outdir  = File.dirname(outfile)

      FileUtils.mkdir_p(outdir)
      File.open(@file_handler.outfile(page.file), 'w') { |f| f << page.to_s }
    end

    puts klasses.inspect


    @file_handler.get_files(:haml).each do |file|
      result = @haml_parser.parse(file)
      result.keys.each do |klass_name|
        hash = result[klass_name]

        out = []
        hash.keys.sort.each do |key|
          out << %{"#{key}":#{hash[key]}}
        end

        if files = klasses[klass_name]
          outfile = @file_handler.outfile(files.first)
          File.open(outfile, 'a') { |f| f << "#{klass_name}.oo('setHTMLCache', {#{out.join(',')}});" }
        end
      end
    end

    @file_handler.get_files(:yml).each do |file|
      comps = JS2::Util::Compilation.parse(file, @file_handler)
      comps.each do |c|
        c.compile(klasses)
      end
    end
  end

  def process_js2 (file)
    page = @lexer.parse_file(file, @factory)
    return page.klasses
  end

  def process_haml

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
