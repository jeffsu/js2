require File.dirname(__FILE__) + '/test_helper.rb'

class TestJs2 < Test::Unit::TestCase

  def setup
    @lexer   = JS2::Parser::Lexer.new
    @factory = JS2::Standard::Factory.new
  end
  
  def test_basic
    @tree = @lexer.parse_file(js2_fixture(:basic), @factory)
    puts @tree.to_s
    assert_equal(@tree.to_s, js_read_fixture(:basic))
  end
end
