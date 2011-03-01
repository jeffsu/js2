require 'optparse'

module JS2
  class Command
    DEFAULT_INTERVAL = 3
    def initialize(argv)
      @ctx = JS2::Context.new
      @ctx['JS2']['FS'] = JS2::FS
      @ctx['argv'] = argv
      @ctx.eval("new JS2.Command(argv)")
    end
  end
end
