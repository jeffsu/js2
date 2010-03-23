class JS2::Util::Config
  attr_accessor :node_factory, :lexer, :file_handler, :lexer, :haml_engine, :haml_vars

  def initialize
    @lexer        = JS2::Parser::Lexer.new
    @node_factory = JS2::Standard::Factory.new
    @file_handler = JS2::Util::FileHandler.new
    @haml_engine  = JS2::Parser::HamlEngine.new
    @haml_vars    = {}
  end
end
