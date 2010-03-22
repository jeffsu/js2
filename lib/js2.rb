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

# standard suite
require "#{dir}/js2/standard/node"
require "#{dir}/js2/standard/class_node"
require "#{dir}/js2/standard/factory"

