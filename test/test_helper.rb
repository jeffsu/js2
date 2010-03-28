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

  def compare_dir (dir1, dir2)
    files1 = Dir["#{dir1}/*.js"] 

    files1.each do |file|
      content1 = File.read(file)
      file2 = file.sub(/^#{dir1}/, dir2)
      content2 = File.read(file2)
      assert_equal(content1.chomp, content2.chomp, "Comparing #{file} and #{file2}")
    end
  end
end
