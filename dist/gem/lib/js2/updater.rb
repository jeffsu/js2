module JS2
  class Updater
    attr_accessor :verbose
    def initialize(indir, outdir)
      @indir   = File.dirname(indir)
      @outdir  = File.dirname(outdir)
      @ctx     = JS2::Context.new
      @verbose = false
    end

    def compile_file(infile, outfile)
      File.open(outfile, 'w') do |f|
        f << @ctx.render(File.read(infile))
      end
    end

    def update!
      Dir["#{@indir}/**/*.js2"].each do |infile|
        outfile = infile.sub(@indir, @outdir).sub(/\.js2$/, '.js')

        in_time  = File.stat(infile).ctime.to_i
        out_time = File.exists?(outfile) ? File.stat(outfile).ctime.to_i : 0

        if in_time > out_time 
          puts "Compiling #{infile}..."
          compile_file(infile, outfile)
        end
      end
    end
  end
end
