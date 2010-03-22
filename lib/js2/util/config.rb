class JS2::Util::Config
  attr_accessor :node_factory, :lexer, :file_handler, :lexer, :haml_parser

  def initialize
    @lexer        = JS2::Parser::Lexer.new
    @node_factory = JS2::Standard::Factory.new
    @file_handler = JS2::Util::FileHandler.new
    @haml_parser = JS2::Parser::Haml.new
  end
end
