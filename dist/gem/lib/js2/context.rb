module JS2
  class Context
    def initialize
      @ctx = JS2::Engine.new
      @ctx.eval(File.read(File.dirname(__FILE__) + '/js2-ruby.js'))
      @ctx['puts'] = lambda { |*args| puts args }
      @js2 = @ctx['JS2']
    end

    def render(str)
      @js2.render(str)
    end

    def eval(str)
      @ctx.eval(render(str))
    end

    def method_missing(method, *args)
      @ctx.send(method, args)
    end
  end
end
