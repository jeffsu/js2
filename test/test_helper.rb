require 'stringio'
require 'test/unit'
require File.dirname(__FILE__) + '/../lib/js2'
JS2_TEST_DIR = File.dirname(__FILE__)

class Test::Unit::TestCase
  def js2_fixture (name)
    return JS2_TEST_DIR + "/fixtures/#{name}.js2"
  end

  def js_read_fixture (name)
    return File.read(JS2_TEST_DIR + "/fixtures/#{name}.js").chomp
  end
end
