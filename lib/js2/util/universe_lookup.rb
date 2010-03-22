class JS2::Util::UniverseLookup
  def initialize
    @file_lookup  = Hash.new
    @klass_lookup = Hash.new
    @comps = Hash.new
  end

  def store_file (file, klasses)
    @klass_lookup[file] = klasses
    klasses.each do |k|
      (@file_lookup[k] ||= []) << file
    end
  end

  def store_comp (file, klasses, files)
    @comps[file] = [ klasses, files ]
  end

  def get_comp_files (file)

  end

  def missing_file
  end
end
