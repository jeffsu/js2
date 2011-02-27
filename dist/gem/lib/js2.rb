js_vm = nil
begin
  require 'v8'
  js_vm = :v8
rescue
  begin
    require 'rubyrhino'
    js_vm = :rhino
  rescue
    raise "Please install a javascript engine gem: rubyracer or rubyrhino"
  end
end

module JS2
end

require 'js2/updater'
require 'js2/plugin'
