require 'tilt'
require 'sprockets/engines'

module JS2
  #
  # JS2 template implementation. See:
  # http://jeffsu.github.com/js2/
  #
  class JS2Template < Tilt::Template
    self.default_mime_type = 'application/javascript'

    def prepare
      @ctx = ::JS2::Context.new
    end

    def evaluate(scope, locals, &block)
      @ctx['data'] = data
      res = @ctx.eval("JS2(data)")
      puts res
      return res
    end
  end
end

module Sprockets
  register_engine '.js2', JS2::JS2Template
end
