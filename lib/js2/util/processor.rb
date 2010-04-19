class JS2::Util::Processor
  attr_accessor :errors

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
    @errors = []

    ret = { :processed => [], :changed => [], :errors => @errors, :klasses => [], :pages => [] }
    ret[:changed] = @file_handler.needs_update
    return ret unless ret[:changed].any?

    pages = ret[:pages]
    klasses = Hash.new

    @file_handler.get_files(:js2).each do |file|
      begin
        page = @lexer.parse_file(file, @factory)
        page.klasses.each do |k|
          (klasses[k.name] ||= []) << page.file
        end

        ret[:klasses] += page.klasses

        pages << page

        outfile = @file_handler.outfile(page.file)
        outdir  = File.dirname(outfile)

        FileUtils.mkdir_p(outdir)
        File.open(@file_handler.outfile(page.file), 'w') { |f| f << page.to_s() }
      rescue Exception => e
        @errors << [ "Can't compile #{file}", e ]
      end
    end

    js2_file = File.dirname(__FILE__) + '/js2bootstrap.js2'
    js2_page = @lexer.parse_file(js2_file, @factory)
    out_file = @file_handler.out_dir + '/js2bootstrap.js'
    FileUtils.mkdir_p(@file_handler.out_dir)
    File.open(out_file, 'w') { |f| f << js2_page.to_s() }

    @file_handler.get_files(:haml).each do |file|
      begin
        result = @haml_parser.parse(file)
        result.keys.each do |klass_name|
          hash = result[klass_name]

          out = []
          hash.keys.sort.each do |key|
            out << %{"#{key}":#{hash[key]}}
          end

          if files = klasses[klass_name]
            outfile = @file_handler.outfile(files.first)
            File.open(outfile, 'a') { |f| f << "#{klass_name}.oo('setHTMLAssets', {#{out.join(',')}});" }
          end
        end
      rescue Exception => e
        @errors << [ "Can't compile #{file}", e ]
      end
    end

    @file_handler.get_files(:yml).each do |file|
      begin
        comps = JS2::Util::Compilation.parse(file, @file_handler)
        comps.each do |c|
          c.compile(klasses, errors)
        end
      rescue Exception => e
        @errors << [ "Can't compile #{file}", e ]
      end
    end

    return ret
  end

end
