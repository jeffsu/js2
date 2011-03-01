require 'optparse'

module JS2
  class Command
    DEFAULT_INTERVAL = 3
    def initialize(argv)
      @ctx = JS2::Context.new
      @ctx['JS2']['FS'] = JS2::FS.new(@ctx)
      @ctx['argv'] = argv
    end

    def get_updater(indir, outdir)
      @ctx.eval("new JS2.Updater('#{indir}', '#{outdir}', true)")
    end

    def run
      @ctx.eval("new JS2.Command(argv)")
    end
  end
end
