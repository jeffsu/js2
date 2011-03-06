require 'optparse'

module JS2
  class Command
    DEFAULT_INTERVAL = 3
    def initialize(argv)
      @ctx = JS2::Context.new
      @ctx['JS2']['FS'] = JS2::FS.new(@ctx)
      @ctx['argv'] = argv
    end

    def cli
      @ctx.eval("new JS2.Commander(argv).cli()")
    end
  end
end
