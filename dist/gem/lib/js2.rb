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
  def self.init_rails
    dirname = File.dirname(File.expand_path('', __FILE__))
    require "#{dirname}/js2/rails"
  end
end

dirname = File.dirname(File.expand_path('', __FILE__))
JS2::ROOT = dirname

%W{ context fs command rack asset_support }.each do |f|
  require "#{dirname}/js2/#{f}"
end
