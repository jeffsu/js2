module JS2
end

module JS2::Parser
end

module JS2::Standard
end

module JS2::Util
end


dir = File.dirname(__FILE__)

# compiling stuff
require "#{dir}/js2/parser/lexer"
require "#{dir}/js2/parser/tokenizer"
require "#{dir}/js2/parser/haml_engine"
require "#{dir}/js2/parser/haml"

# standard suite
require "#{dir}/js2/standard/node"
require "#{dir}/js2/standard/class_node"
require "#{dir}/js2/standard/factory"

# util stuff
require "#{dir}/js2/util/processor"
require "#{dir}/js2/util/file_handler"
require "#{dir}/js2/util/config"
require "#{dir}/js2/util/compilation"
