module JS2
  class Console
    def log(*str)
      puts str.join(',')
    end
  end

  class Context
    def initialize
      @ctx = JS2::Engine.new
      @ctx['JS2_RUBY_FILE_ADAPTER'] = FS.new
      @ctx['console'] = Console.new
      @ctx.eval(File.read(File.dirname(__FILE__) + '/js2.js'))
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

  end
end
