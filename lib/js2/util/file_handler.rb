class JS2::Util::FileHandler
  attr_accessor :js2_dir, :out_dir, :haml_dir

  def initialize 
    @js2_dir  = '.'
    @out_dir  = '.'
    @haml_dir = '.'

    @lookup = {
      :js2  => :js2_dir,
      :haml => :haml_dir,
      :yml  => :js2_dir 
    }

    @mtimes = Hash.new
  end

  def needs_update?
    @found = Hash.new

    files = []
    files += changed_files?(:js2)
    files += changed_files?(:haml)
    files += changed_files?(:yml)

    if files.any?
      return true
    end

    missing = false
    @mtimes.each_pair do |f|
      unless @found[f]
        @mtimes.delete(f)
        missing = true
      end
    end

    return missing
  end

  def outfile (file)
    return file.sub(/^#{@js2_dir}/, @out_dir).sub(/\.js2$/, '.js')
  end

  def get_files (ext)
    ext = ext.to_sym

    my_ext = :js2 == ext ? 'js2' : "js2.#{ext}"
    my_dir = self.send(@lookup[ext])
    return Dir.glob(my_dir + "/**/*/*.#{my_ext}") + Dir.glob(my_dir + "/*.#{my_ext}")
  end

  def reset!
    @mtimes  = Hash.new
  end

  def changed_files? (ext)
    ret = []
    get_files(ext).each do |f|
      @found[f] = true
      mtime = File.mtime(f)
      if ! @mtimes[f] || @mtimes[f] < mtime
        @mtimes[f] = mtime
        ret << f
      end
    end

    return ret
  end


end
