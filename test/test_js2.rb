require File.dirname(__FILE__) + '/test_helper.rb'

class TestJs2 < Test::Unit::TestCase

  def setup
    @lexer   = JS2::Parser::Lexer.new
    @factory = JS2::Standard::Factory.new
  end
  
  def test_processor

    config = JS2::Util::Config.new
    fh = config.file_handler 
    fh.js2_dir  = './test/fixtures'
    fh.out_dir  = './test/out'
    fh.haml_dir = './test/fixtures'

    system("rm -rf #{fh.out_dir}")

    processor = JS2::Util::Processor.new(config)
    ret1 = processor.process!
    ret2 = processor.process!
    assert_equal(ret2[:changed].any?, false)

    compare_dir(fh.out_dir, './test/compiled')
  end

  def test_rdoc

    config = JS2::Util::Config.new
    fh = config.file_handler 
    fh.js2_dir  = './test/fixtures'
    fh.out_dir  = './test/out'
    fh.haml_dir = './test/fixtures'
    fh.doc_dir  = './test/doc'
    system("rm -rf #{fh.out_dir}")

    processor = JS2::Util::Processor.new(config)
    ret = processor.process!
    JS2::Util::Rdoc.build(ret[:pages], fh)
  end

end
