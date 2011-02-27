require 'js2/plugin'
module JS2
  module Plugin
    class Rack
      # Initialize the middleware.
      #
      # @param app [#call] The Rack application
      def initialize(app)
        @app = app
      end

      # Process a request, checking the Sass stylesheets for changes
      # and updating them if necessary.
      #
      # @param env The Rack request environment
      # @return [(#to_i, {String => String}, Object)] The Rack response
      def call(env)
        JS2::Updater.update!
        @app.call(env)
      end
    end
  end
end


