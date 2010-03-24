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
    ret = { :processed => [], :changed => [] }
    ret[:changed] = @file_handler.needs_update
    return ret unless ret[:changed].any?

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

    return ret
  end

end
