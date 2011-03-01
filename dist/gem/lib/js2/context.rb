module JS2
  class Console
    def log(*str)
      puts str.join(',')
    end
  end

  class Context
    def initialize
      @ctx = JS2::Engine.new
      @ctx.eval(File.read(File.dirname(__FILE__) + '/js2-ruby.js'))
      @ctx['console'] = Console.new
      @js2 = @ctx['JS2']
    end

    def []= (k,v)
      @ctx[k] = v
    end

    def [] (k)
      @ctx[k]
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
