require File.dirname(__FILE__) + '/test_helper.rb'

class TestJs2 < Test::Unit::TestCase

  def setup
    @lexer   = JS2::Parser::Lexer.new
    @factory = JS2::Standard::Factory.new
  end
  
  def test_basic
    #@tree = @lexer.parse_file(js2_fixture(:basic), @factory)
    #assert_equal(@tree.to_s, js_read_fixture(:basic))
  end

  def test_processor

    config = JS2::Util::Config.new
    fh = config.file_handler 
    fh.js2_dir  = './test/fixtures'
    fh.out_dir  = './test/out'
    fh.haml_dir = './test/fixtures'

    system("rm -rf #{fh.out_dir}")

    processor = JS2::Util::Processor.new(config)
    processor.process!

    compare_dir(fh.out_dir, './test/compiled')
  end

  def test_rdoc

    config = JS2::Util::Config.new
    fh = config.file_handler 
    fh.js2_dir  = './test/fixtures'
    fh.out_dir  = './test/out'
    fh.haml_dir = './test/fixtures'

    processor = JS2::Util::RDoc.new(config)
    processor.process!
  end

end
