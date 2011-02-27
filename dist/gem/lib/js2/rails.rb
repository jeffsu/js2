# pilfered from HAML
unless defined?(JS2::RAILS_LOADED)                                                                     
  JS2::RAILS_LOADED = true                                                                             
                                                                                                        
  if defined?(ActionController::Metal)
    # Rails >= 3.0                    
    require 'js2/rack'                                                                          
    Rails.configuration.middleware.use(JS2::Plugin::Rack)                                              
  elsif defined?(ActionController::Dispatcher) &&                                                       
      defined?(ActionController::Dispatcher.middleware)                                                 
    # Rails >= 2.3
    require 'js2/rack'
    ActionController::Dispatcher.middleware.use(JS2::Plugin::Rack)                                     
  else
    module ActionController
      class Base
        alias_method :js2_old_process, :process                                                        
        def process(*args)
          JS2::Plugin.check_for_updates                                                                
          js2_old_process(*args)
        end 
      end 
    end   
  end   
end
