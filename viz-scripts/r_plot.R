# Load required libraries
library(jsonlite)

# Function to create plot and save as PNG
create_plot <- function() {
  # Create simple data
  x <- 1:5
  y <- c(2, 3, 5, 4, 5)
  data <- data.frame(x = x, y = y)
  
  # Create a simple plot and save as PNG
  png("public/r-plot.png", width = 800, height = 600)
  
  # Set margins and create a clean plot
  par(mar = c(4, 4, 2, 1))  # Bottom, left, top, right margins
  plot(x, y,
       type = "l",        # Line plot
       col = "blue",      # Line color
       lwd = 2,           # Line width
       main = "Simple R Plot",
       xlab = "X",
       ylab = "Y",
       bty = "L")        # Only left and bottom axes
  
  dev.off()
  
  # Return data as JSON
  toJSON(data, pretty = TRUE)
}

# Execute the function if running as script
if (!interactive()) {
  cat(create_plot())
}