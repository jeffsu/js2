begin
  require 'v8'
  JSVM = :v8
rescue
  begin
    require 'rhino'
    JSVM = :rhino
  rescue
    raise "Please install a javascript engine gem: rubyracer or rubyrhino"
  end
end


module JS2
  Engine = JSVM == :v8 ? V8::Context : Rhino::Context
end

dirname = File.dirname(File.expand_path('', __FILE__))

require "#{dirname}/js2/context"
require "#{dirname}/js2/updater"
