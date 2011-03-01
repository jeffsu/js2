class JS2::FS
  def initialize(context) 
    @ctx = context
  end

  def read(file)
    File.read(file)
  end

  def find(dir, ext, recursive) 
    lookup = recursive ? "**" : "."
    return Dir["#{lookup}/*.#{ext}"].reject { |f| f == /^./ }
  end

  def isDirectory(dir)
    return File.directory?(dir)
  end

  def isFile(dir)
    return File.file?(dir)
  end

  def write(out, data) 
    File.open(out, 'w') { |f| f << data }
  end

  def mtime(file)
    File.stat(file).mtime
  end

  def setInterval(code, time)
    while true
      @ctx.eval(code)
      sleep(time/1000)
    end
  end
end
