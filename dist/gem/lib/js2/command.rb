require 'optparse'
module JS2
  class Command
    def initialize()
      @command = ARGV.shift
      @options = {}
      if @command == 'run'
        @opts = OptionParser.new do |opts|
          opts.banner = "Usage: js2 run <file>"
        end
        run_file(ARGV)

      elsif @command == 'compile'
        @opts = OptionParser.new do |opts|
          opts.banner = "Usage: js2 compile <indir|infile> <outdir|outfile>"
          opts.on('-v', '--verbose', 'Run verbosely') do |v|
            @options[:verbose] = true
          end
        end
        compile(ARGV)

      elsif @command == 'watch'
        @options[:interval] = 2
        @opts = OptionParser.new do |opts|
          opts.banner = "Usage: js2 watch <indir> <outdir>"
          opts.on('-v', '--verbose', 'Run verbosely') do |v|
            @options[:verbose] = true
          end

          opts.on('-t', '--time-interval=[time]', 'Interval (in seconds) to check changed files') do |i|
            @options[:interval] = i.to_i
          end
        end
        watch(ARGV)

      else
        @opts = OptionParser.new do |opts|
          opts.banner = <<-END
Usage: js2 <command> [arguments]

Commands:
  * run <file>               - Executes a given js2 file
  * compile <indir> <outdir> - Compiles all files (recursively) with the js2 extension to js
  * watch <indir> <outdir>   - Runs a daemon that watches for changed files
          END
        end
        puts @opts
      end
    end

    private

    def compile(args)
      indir  = args.shift
      outdir = args.any? ? args.shift : indir

      if File.directory?(indir) && File.directory?(outdir)
        get_updater(indir, outdir).update!
      else
        puts @opts
      end
    end

    def watch(args)
      indir  = args.shift
      outdir = args.any? ? args.shift : indir
      seconds = args.any? ? args.shift : 3

      updater = get_updater(indir, outdir)
      while (1) 
        if @options[:interval]
          puts "Checking..."
        end
        updater.update!
        sleep seconds
      end
    end

    def get_updater(indir, outdir)
      updater = Updater.new(indir, outdir)
      updater.verbose = true if @options[:verbose]
      return updater
    end

    def run_file(files)
      unless files.any?
        puts @opts
        return
      end

      ctx = JS2::Context.new
      files.each do |f|
        if File.exists?(f)
          ctx.eval(File.read(f))
        else
          raise "File #{f} does not exist"
        end
      end
    end
  end
end
