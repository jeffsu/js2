require File.dirname(__FILE__) + '/test_helper.rb'

class TestJs2 < Test::Unit::TestCase

  def setup
    @lexer = JS2::Parser::Lexer.new
  end
  
  def test_basic
    @tree = @lexer.parse_file(js2_fixture(:basic), JS2::Standard::Factory)
    puts @tree.to_s
    assert_equal('hello', 'hello')
  end
end
